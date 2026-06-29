# Session 08 — Planning sub-program B: the quantitative sheaf-cohomology of disagreement

**Date:** 2026-06-08
**Direction:** 4 — Distributed semantics, **sub-program B** (`09_FUTURE_DIRECTIONS_BRAINSTORM.md` §4; follows [Session 07](07-distributed-semantics-sheaf-cohomology-2026-06-07.md) sub-program A)
**Status:** **Planning / scoping OPEN** (no theorems claimed; no code changed)
**Purpose:** now that sub-program A (coherence) is **established** as [T010](../02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md), open the gated sheaf-cohomology bet — and resolve its first real fork: *which* cohomology, and whether it needs a schema change at all.

---

## 0. The gate is open (and what that bought us)

Session 07 settled the sequencing: *coherence first, sheaf-cohomology after*, with the operational reason that **holonomy around $A\to B\to C\to A$ is undefined until $A\to B\to C$ composition is coherent** — you must define the connection before computing its curvature. That gate is now passed:

- **[T010](../02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md) (established, cross-checked 2026-06-08):** transport is a pseudofunctor exactly on $\mathcal{P}^\circ$ = the **iso-monodromy-free** sub-bicategory; off $\mathcal{P}^\circ$ a cycle drifts or drops a claim. So "transport composes" is now a *theorem with a precise domain*, not an assumption.
- **Consequence for B:** the sheaf is well-posed **on $\mathcal{P}^\circ$**. Cohomology over the *whole* Plexus is the question of whether local sections defined on $\mathcal{P}^\circ$-pieces glue across the obstructions that live *outside* $\mathcal{P}^\circ$.

That last sentence is the whole sub-program in one line, and it reframes B more sharply than Session 07 did.

---

## 1. The hard fact B2b already proved, and why it forces a fork

[Session 07 §3.2](07-distributed-semantics-sheaf-cohomology-2026-06-07.md) is load-bearing here and must not be re-litigated: **the naive $\mathbb{R}$-valued holonomy is a coboundary, hence exact, hence trivial.** Any connection built from *node potentials* (target-minus-source log-odds for the tracked claim) telescopes to $0$ around every loop. A non-trivial $H^1(\mathbb{R})$ class needs an **edge datum independent of the nodes**, which the schema does not carry (`claimMapJson` is `{fromClaimId: toClaimId}`, no per-edge weight).

So the quantitative-$\mathbb{R}$ route from Session 07 §2.1 **cannot be non-vacuous on current data**. This is not a setback; it is the fork the sub-program must own:

> **The B fork.** Either (B-abelian) **add an independent per-edge transport weight** to `RoomFunctor` and pursue the $\mathbb{R}$-valued quantitative $H^1$, or (B-possibilistic) pursue the **Abramsky contextuality** obstruction, which is *edge-weight-free* — it lives in the **compatibility relation** of local sections, not in node potentials — and may already be non-trivial on current data.

Session 07 §2.2 named both flavours but treated the abelian one as the first target. **B2b's exactness result inverts that priority.** That inversion is the central finding of this session.

---

## 2. The reframe: T010's monodromy obstruction *is* the possibilistic cohomology class

The strongest insight available now. Abramsky's sheaf-theoretic contextuality is: a presheaf of **local sections** (assignments consistent on each cover), and the obstruction is whether locally-compatible sections **glue to a global section** — local consistency, global inconsistency, the obstruction a non-trivial cohomology class. Port the dictionary to the Plexus:

| Abramsky | Plexus |
|---|---|
| measurement context / cover | a room (deliberation) + the claims a functor maps out of it |
| local section (compatible assignment on a context) | a room's local claim-acceptance / support pattern |
| compatibility of sections on overlaps | a transport functor identifying claims across rooms **agrees** (claim-closed up to ECC iso) |
| global section (glues all local data) | a single consistent acceptance across all rooms in a cycle |
| obstruction to a global section ($H^1 \neq 0$) | a cycle whose claims **cannot** be tracked consistently around it |

The right column's last cell is **exactly T010's "outside $\mathcal{P}^\circ$".** The `drift-noniso` and `dropped` fates the [H2-refined probe](../../scripts/plexus-topology-probe.ts) classifies are precisely *local-consistent-but-globally-inconsistent* patterns:

- **inside $\mathcal{P}^\circ$** (closed / drift-iso) ⟹ the local sections glue up to ECC iso ⟹ **trivial** possibilistic class on that cycle;
- **outside $\mathcal{P}^\circ$** (drift-noniso / dropped) ⟹ no consistent global tracking ⟹ **candidate non-trivial** possibilistic class.

> **Conjecture B1 (not a premise).** The support of the non-trivial possibilistic ($\check{C}$ech, boolean/min-quantale coefficient) $H^1$ of the Plexus claim-sheaf is exactly the set of cycles **outside $\mathcal{P}^\circ$** (T010). Equivalently: the Abramsky contextuality obstruction of distributed deliberation *is* the iso-monodromy obstruction T010 already isolated.

If B1 holds, sub-program B's possibilistic half is **non-vacuous on current data** (the live `dropped` witness is already a candidate class), needs **no schema change**, and **reuses the T010/H2 machinery** wholesale. That is the cheapest, highest-information first step — the Session-02 lever again.

---

## 3. The two routes, scoped

### Route B-possibilistic (no schema change; exploits T010) — **lead**

- **Coefficient object:** the boolean / min-quantale flavour (Session 07 §2.2). The "parked enrichment prize" idempotent quantale is *exactly* what a possibilistic sheaf wants.
- **The sheaf:** local sections = per-room compatible acceptance patterns; restriction maps = transport along functors; the gluing condition = claim-closure up to ECC iso (T010's $\mathcal{P}^\circ$ membership).
- **The obstruction:** $\check{C}$ech $H^1$ with the boolean coefficient; a non-trivial class = a cycle of rooms pairwise-compatible but globally not — the **Condorcet 3-cycle** of Session 07 §2.3 in its honest (compatibility, not magnitude) form.
- **B-poss target witness:** a 3-room cycle, each pair claim-closed (in $\mathcal{P}^\circ$ pairwise) yet the triangle outside $\mathcal{P}^\circ$ — a *genuine* contextuality witness (pairwise consistent, globally not), distinct from the trivial "one edge already drops" case. **This is the real minimal viable witness, sharper than §2.3's.**
- **Cost:** linear algebra / a nerve computation over the existing `RoomFunctor` + `RoomTransportSnapshot` + the ECC-iso oracle. No production change.

### Route B-abelian (schema change; the quantitative prize) — **deferred behind a decision**

- **Coefficient object:** $\mathbb{R}$ (log-odds), quantitative — magnitude of irreducible disagreement.
- **Blocker (B2b):** needs an **independent per-edge transport weight** on `RoomFunctor` — a log-odds shift the *edge asserts*, not derivable from node beliefs. This is the **Q-042 quantitative offshoot**, logged but not adopted.
- **The schema question (must be answered before B-abelian is even well-posed):** *what does a per-edge transport weight mean?* Candidate readings: (i) the functor author's confidence that the claim-alignment is faithful; (ii) a translation/`drift` penalty; (iii) an evidential discount on imported support. Each gives a different connection and a different $H^1$. **Choosing the meaning is a modelling commitment, not a schema detail** — and it should not be made to satisfy a theorem.
- **The confidence-geometry shortcut is CLOSED (2026-06-27, [Session 14d](14d-step4-babelian-offshoot-refuted-2026-06-27.md)).** [Q-045](../01_OPEN_QUESTIONS_REGISTRY.md#q-045) §5 conjectured that the Fisher–Rao / KL position distance could *supply* this per-edge weight as a *derived* value, sparing the meaning-decision. It cannot: every such magnitude is node-derived $f(p_{\mathrm{src}},p_{\mathrm{tgt}})$, so it fails B2b's node-independence requirement exactly as the naive holonomy did — $\Delta w$ is the killed coboundary, unsigned KL is not an oriented 1-cochain, and antisymmetrised-KL is a *spurious* non-coboundary (nonzero on coherent, zero-obstruction cycles). So the weight **must** be one of (i)–(iii)'s exogenous edge assertions; confidence geometry supplies only the **unit** (log-odds nats) and a candidate **functional form** (a Bregman discrepancy of the *asserted* alignment against identity), never the datum.
- **Cost:** a `RoomFunctor.transportWeightJson` (or per-mapping weight) migration + aggregator wiring + the meaning decision. A gated production change.

---

## 4. Why B-possibilistic leads (and the honest risk)

1. **Non-vacuous now.** B2b killed B-abelian on current data; B1 conjectures B-possibilistic is alive on current data (the `dropped` witness). De-risk by attacking the live one first.
2. **No schema commitment.** B-possibilistic needs no modelling decision about an invented per-edge quantity — it reads only structure already present (claim-maps + ECC-iso). It cannot be accused of "adding a number to make $H^1$ non-zero."
3. **Reuses established machinery.** T010 + the H2 oracle already compute $\mathcal{P}^\circ$ membership per cycle; B-possibilistic is (conjecturally) a repackaging of that as a cohomology class plus the *pairwise-vs-globally* refinement.
4. **It is the vindication the brainstorm wanted.** "The disagreement is a non-trivial cohomology class" = "this is a real disagreement, not a misunderstanding" — and the possibilistic class says exactly that *qualitatively*, which is the honest claim. Magnitude (B-abelian) is a *later* enrichment, not the headline.

**The honest risk to B1.** The Abramsky obstruction is genuinely cohomological only if the **pairwise-compatible-but-globally-incompatible** case actually occurs — a cycle every edge of which is in $\mathcal{P}^\circ$ pairwise, yet the composite leaves $\mathcal{P}^\circ$. If *every* out-of-$\mathcal{P}^\circ$ cycle already has a single bad edge (a `dropped`/`drift-noniso` *edge*, not just a bad *composite*), then the obstruction is **local** (it has a locus — Direction 2's job) and there is **no genuine global class**. So the load-bearing empirical question is **§5 below**, and it can refute B1 the way B2b refuted naive abelian holonomy.

---

## 5. The cheapest decisive experiment (do this first)

Extend [`scripts/plexus-topology-probe.ts`](../../scripts/plexus-topology-probe.ts) with a `contextuality` pass that, for each cycle outside $\mathcal{P}^\circ$, classifies it as:

- **locally obstructed** — at least one *edge* is itself out of $\mathcal{P}^\circ$ (a single-hop drift-noniso/drop). The obstruction has a locus ⟹ **not** a genuine global class (Direction 2 owns it).
- **globally obstructed (genuine contextuality)** — *every edge* is pairwise in $\mathcal{P}^\circ$ but the *composite around the cycle* leaves it. **This is the non-trivial possibilistic $H^1$ witness.**

**Decision rule (mirrors B2b's):**
- if **no** cycle is globally obstructed on current data ⇒ B-possibilistic is *vacuous on current data* (every disagreement is local), and B reduces to the deferred B-abelian schema decision — *or* to seeding a synthetic contextuality witness to validate the construction before real data accrues;
- if **some** cycle is globally obstructed ⇒ B1 has a live witness; build the $\check{C}$ech construction and promote to a conjecture + theorem track.

### 5.1 Artifact + result (run 2026-06-08)

The `contextuality` pass is now in [`scripts/plexus-topology-probe.ts`](../../scripts/plexus-topology-probe.ts) (`contextuality` reads live data; `seed-contextuality` builds + classifies a synthetic witness). It refines the round-trip fate into the §5 partition, with one sharpening forced by the implementation: the *pairwise* check needs **back-edges** to verify compatibility, so the precise classifier is:

- **`local-drop`** — a hop drops (no image): the drop hop is the locus.
- **`local-pair`** — drift-noniso *and* some consecutive pair $r_i\to r_{i+1}$ lacks a faithful back-edge 2-cycle (no back-edge, or its 2-cycle is itself drift-noniso): that pair is the locus.
- **`global`** — drift-noniso *and* **every** consecutive pair has a faithful back-edge 2-cycle (closed up to ECC iso) yet the composite drifts non-iso: genuine contextuality.

**Result on live data (2026-06-08): B-possibilistic is VACUOUS on current data.** The single out-of-$\mathcal{P}^\circ$ cycle (the B2b `dropped` witness) classifies as **`local-drop`** — `LOCALLY obstructed = 1 (drop=1, pair=0)`, `GLOBALLY obstructed = 0`. Every disagreement on current data has a **locus** ⟹ Direction 2 owns it; there is **no genuine global class yet**. This is the *expected* branch (§5 decision rule, first bullet) — and crucially the classifier did **not** mistake the local drop for a global class.

**Construction validated by a synthetic witness.** `seed-contextuality` builds the genuine Abramsky cell: three rooms each with two not-inter-derivable claims $p,q$; forward edges $A\to B, B\to C$ **faithful**, $C\to A$ a **twist** ($p\leftrightarrow q$); matched inverse-twist back-edges so **every 2-cycle closes** but the triangle $A\to B\to C\to A$ sends $p_A\mapsto p_B\mapsto p_C\mapsto q_A$ (drift-noniso). The run reports exactly the predicted shape:
- the three 2-cycles (A↔B, B↔C, C↔A) all **in-$\mathcal{P}^\circ$** (6/6 starts closed — pairwise consistency by construction);
- the 3-cycle yields **2 `GLOBAL` witnesses** (both $p_A$ and $q_A$): *"every pair faithful, lands non-iso"* ⟹ the non-trivial possibilistic $H^1$ cell;
- the live `dropped` cycle stays **`local-drop`** — the classifier discriminates correctly.

**B-exp verdict.** The construction is **correct and discriminating** (synthetic GLOBAL witness fires; local drop is not mis-promoted), but the **lead route is vacuous on *current* data** — the live Plexus has no genuine contextuality cell yet, only a local drop. So B-possibilistic is *real and well-posed* but *needs richer real data (or the synthetic witness) to bite*. This mirrors the 0b/B2b discipline: the instrument works; the live corpus is just too sparse to exhibit the phenomenon yet.

### 5.2 B-poss-0 — the Čech construction (run 2026-06-08)

The `cech` / `seed-cech` subcommands of [`scripts/plexus-topology-probe.ts`](../../scripts/plexus-topology-probe.ts) build the possibilistic Čech $H^1$ over the **nerve of the room cover** and make the §2 reframe a *degree-1 cohomology statement*, not a label:

- **The nerve.** 0-cells = rooms; **1-cells = pairwise-compatible room pairs** for the tracked claim (a faithful back-edge 2-cycle, i.e. the pair is in $\mathcal{P}^\circ$). The bad edge of a *local* obstruction (a drop, or a non-faithful pair) is **not a 1-cell of the nerve**.
- **The class.** A section tracks a claim's identity; the **monodromy** of a nerve cycle is the round-trip claim-map composite. Local sections **glue** along a cycle iff the monodromy is trivial (claim returns up to ECC iso); non-trivial monodromy is a non-trivial $H^1$ class. Reported: $\beta_1(\text{nerve}) = E-V+C$ (candidate rank) and the **boolean $H^1$ rank** = independent non-trivial 1-cycles, capped at $\beta_1$ (distinct from the per-claim witness *multiplicity*).

**The cohomological payoff (the real B-poss-0 deliverable).** *Local* obstructions are **coboundary-trivial**: their bad edge is not a nerve 1-cell, so the obstructed loop is **not even a cycle of the nerve** ⟹ it carries **no** $H^1$ class (re-choosing the local section at the bad vertex removes it). *Global* obstructions are genuine nerve cycles with non-trivial monodromy ⟹ non-trivial $H^1$ generators. **So $H^1$ is supported *exactly* on the global cells — Conjecture B1 made a degree statement, demonstrated on data.**

**Results:**
- **synthetic witness** (`seed-cech`): $\beta_1(\text{nerve}) = 1$, **$H^1$ rank $= 1$** (one independent non-trivial triangle; per-claim multiplicity 2 for $p_A, q_A$ correctly *not* over-counted as rank), the off-nerve local drop contributing **0**;
- **live data** (`cech`, clean): the compatible nerve has **0 edges** (the only live cycle's bad pair is a drop, excluded), so $\beta_1 = 0$, **$H^1 = 0$**, with the local drop counted as an off-nerve loop contributing nothing — **coboundary-triviality demonstrated on real data**.

**B-poss-0 verdict.** The possibilistic Čech $H^1$ is **constructed, honest about rank vs multiplicity, and validated**: it returns $H^1 = 1$ on a genuine contextuality cell and $H^1 = 0$ on current (all-local) live data, with the local-vs-global partition realized as the *off-nerve vs non-trivial-monodromy* dichotomy. **B1 is corroborated** (not yet a theorem): $H^1$ support = the global cells. The remaining gap to a theorem is the honest one — a *live* witness (current data has none) and the rank-vs-multiplicity argument promoted from "distinct-room-set proxy capped at $\beta_1$" to a real cycle-basis computation.

### 5.3 The rank argument (B-poss-1 follow-through, run 2026-06-08)

The rank gap above is now closed at the *construction* level. `computeH1RankBasis` in [`scripts/plexus-topology-probe.ts`](../../scripts/plexus-topology-probe.ts) replaces the room-set proxy with a genuine **spanning-tree fundamental cycle basis + holonomy group**:

- per nerve component, a BFS spanning tree rooted at $r_0$; each root claim's section propagated along the tree; each of the $\beta_1$ non-tree edges gives a fundamental cycle whose holonomy is a **permutation $\sigma_e$ of $r_0$'s claim-iso-classes**;
- the **holonomy group** $G = \langle\sigma_e\rangle$ is generated by closure; $\operatorname{rank} H^1 = \log_2|G|$, **exact when $G$ is an elementary abelian 2-group** (involution holonomies — the binary $p/q$ case), a flagged lower bound otherwise.

**Why it's a real improvement over the proxy:** the holonomy group **correctly merges dependent cycles** — several nerve 1-cycles carrying the *same* holonomy contribute *one* generator (the proxy double-counted them, capped at $\beta_1$). *Validation:* synthetic witness ⟹ $|G|=2$ ($G\cong\mathbb{Z}/2$, the $p\leftrightarrow q$ swap), e.a.2 confirmed ⟹ **rank $=1$ exact**; live data ⟹ $|G|=1$ ⟹ **rank $=0$**. The rank lemma (holonomy-group form, $\operatorname{rank} = \beta_1 - \dim\ker$, exact for e.a.2) is now stated in [C015 §positive-settlement](../03_CONJECTURES/C015-possibilistic-cohomology-iso-monodromy.md). The remaining gap to a theorem is the *paper proof* (gauge-independence of $\sigma_e$ + $\log_2|G|$ = $\check{C}$ech $H^1$ rank for the boolean coefficient) and the *live witness*.


This is one afternoon, read-only + a synthetic seed, and it kills-or-greenlights the *lead* route exactly as 0b/B2b did for their phases.

---

## 6. Cross-direction synergies (record)

- **Direction 2 (separation / locus).** The *locally obstructed* bucket of §5 is precisely disagreement *with* a locus — the minimal-disagreement extractor's territory ([DEV_SPEC](../DEV_SPEC-minimal-disagreement-extractor-2026-06-04.md), [T008](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md)). The *globally obstructed* bucket is disagreement *without* a local locus — that is the clean division of labour Session 07 §4 anticipated, now made a **decidable partition** by §5.
- **Direction 1 (behaviours $B = B^{\perp\perp}$).** A room's local sections are its bi-orthogonal behaviours; "does this cycle glue?" is the presheaf-vs-sheaf / $H^0$-locality question. The "constitutively-needs-import" rooms (§1 of the brainstorm) are those whose local sections do **not** extend — a $H^0$ statement that B-possibilistic's $H^1$ sits atop.
- **Direction 3 (confidence algebra).** The two coefficient objects are the two confidence modes: **min-quantale → possibilistic** (B-poss), **log-odds → abelian** (B-abelian). Session 07 §2.2's "park the enrichment prize" decision is what cleanly separates them; this session *uses* both halves of that fork rather than regretting it.
- **T010 / sub-program A.** $\mathcal{P}^\circ$ is the home of the sheaf; the H2 ECC-iso oracle is the gluing oracle. B-possibilistic is, conjecturally, sub-program A's output viewed cohomologically.

---

## 7. Proposed phase map

| Phase | Work | Gate |
|------|------|------|
| **B-exp** | `contextuality` probe pass: partition out-of-$\mathcal{P}^\circ$ cycles into *locally* vs *globally* obstructed (§5) | **✅ DONE 2026-06-08** — construction correct + discriminating (synthetic GLOBAL witness fires; live data is **all-local / vacuous** for B-poss — one `local-drop`, zero global) |
| **B-poss-0** | The $\check{C}$ech construction — nerve of the room cover, boolean/min-quantale coefficient, $H^1$ from the existing oracle (validate against the **synthetic** witness; live data has no cell yet) | **✅ DONE 2026-06-08** — `cech`/`seed-cech`; $H^1=1$ on synthetic, $H^1=0$ on live; **local obstructions shown coboundary-trivial** (off-nerve) ⇒ $H^1$ supported exactly on global cells (B1 corroborated) |
| **B-poss-1** | Conjecture B1 stated + the *globally-obstructed = non-trivial $H^1$* equivalence; promote to a C-conjecture + open question | **✅ DONE 2026-06-08** — [C015](../03_CONJECTURES/C015-possibilistic-cohomology-iso-monodromy.md) + [Q-043](../01_OPEN_QUESTIONS_REGISTRY.md#q-043); gaps named (rank argument, live witness) |
| **B-abel-dec** | The per-edge-transport-weight **meaning** decision (Q-042 offshoot) — a modelling commitment, deliberately separate from any theorem | none (a decision, not a build) |
| **B-abel** | Schema + aggregator + $\mathbb{R}$-valued $H^1$ (quantitative magnitude) | needs B-abel-dec + a gated PR |
| **B-site** | Lift to full Grothendieck-site / stack cohomology | only if B-poss-1 *and* B-abel motivate it |

---

## 8. Open forks (NOT resolved this session)

- **B-abelian's per-edge weight meaning** (B-abel-dec). Three readings (§3); each yields a different $H^1$. **A modelling commitment, never made to satisfy a theorem.** Deferred.
- **Coefficient object, settled direction not value:** lead with the **boolean/min-quantale** (possibilistic), defer the **$\mathbb{R}$/log-odds** (abelian). Both are eventually wanted; the *order* is what B2b decided.
- **Granularity:** graph/nerve-level $\check{C}$ech first; full sheaf-over-a-site (B-site) only if a real witness motivates it. (Same posture as Session 07's settled granularity fork.)
- **B1 is a conjecture, not a premise** — exactly like the Session-07 mode→coefficient correspondence it specializes. Nothing downstream may assume it until §5 produces a witness.

---

## 9. Decisions recorded this session

- **Resolved (sequencing, the central finding):** B2b's exactness result **inverts** Session 07 §2.1's priority. Lead sub-program B with the **possibilistic / Abramsky** route (edge-weight-free, non-vacuous-candidate on current data, reuses T010); **defer** the abelian / quantitative-$\mathbb{R}$ route behind the per-edge-weight *meaning* decision.
- **Resolved (the reframe):** the sheaf is well-posed **on $\mathcal{P}^\circ$**; B's whole question is gluing *across* the out-of-$\mathcal{P}^\circ$ obstructions. T010's monodromy obstruction is conjecturally (B1) the possibilistic cohomology class itself.
- **Resolved (the decisive partition):** the *locally obstructed* vs *globally obstructed* split (§5) is the make-or-break experiment and the clean Direction-2 boundary — a single edge out of $\mathcal{P}^\circ$ ⇒ local (has a locus); only a *composite* leaving $\mathcal{P}^\circ$ with all edges in ⇒ genuine global class.
- **Parked:** B-abelian (schema + magnitude) and B-site (Grothendieck stack) until B-poss produces a real witness.
- **Resolved (B-exp, 2026-06-08):** the `contextuality` probe pass is built and validated — the synthetic 3-room twist witness fires **2 `GLOBAL`** cells (pairwise consistent, triangle non-iso) and all three 2-cycles read **in-$\mathcal{P}^\circ$**, while the live `dropped` cycle correctly stays **`local-drop`**. **But B-possibilistic is VACUOUS on current data:** the live Plexus has *zero* genuine global cells — every out-of-$\mathcal{P}^\circ$ obstruction is local (has a locus ⇒ Direction 2). The instrument works; the live corpus is too sparse to exhibit contextuality yet.
- **Resolved (B-poss-0, 2026-06-08):** the possibilistic **Čech $H^1$** is constructed (`cech`/`seed-cech`) and validated — $H^1=1$ on the synthetic cell, $H^1=0$ on live data — with the **central deliverable**: local obstructions are **coboundary-trivial** (their bad edge is off the compatible nerve, so they carry no class), so **$H^1$ is supported exactly on the global cells**. B1 (T010's monodromy obstruction = the possibilistic cohomology class) is **corroborated on data**, the local-vs-global partition realized as off-nerve-vs-non-trivial-monodromy.
- **Resolved (B-poss-1, 2026-06-08):** B1 promoted to conjecture [C015](../03_CONJECTURES/C015-possibilistic-cohomology-iso-monodromy.md) + open question [Q-043](../01_OPEN_QUESTIONS_REGISTRY.md#q-043), with the two honest gaps as settlement conditions: (i) the **rank argument** (cycle-basis over $\mathbb{F}_2$/min-quantale, replacing the distinct-room-set proxy), (ii) a **live witness** (current data has none). The identification (nerve-cycle-non-trivial-monodromy $\iff$ out-of-$\mathcal{P}^\circ$-but-pairwise-in) is a definitional reduction from T010, Agda-able.
- **Resolved (rank argument, 2026-06-08):** the rank gap is closed at the *construction* level — `computeH1RankBasis` computes a genuine **spanning-tree fundamental cycle basis + holonomy group**, $\operatorname{rank} H^1 = \log_2|G|$ (exact for elementary-abelian-2 holonomy, flagged lower bound otherwise). It **correctly merges dependent cycles** (the proxy's defect): synthetic $\Rightarrow |G|=2, \operatorname{rank}=1$ exact; live $\Rightarrow |G|=1, \operatorname{rank}=0$. The rank lemma is stated in [C015](../03_CONJECTURES/C015-possibilistic-cohomology-iso-monodromy.md).
- **Resolved (paper proof, 2026-06-08):** the two non-empirical settlement conditions are **proven on paper** — [`C015-proof-rank-and-identification-2026-06-08.md`](../C015-proof-rank-and-identification-2026-06-08.md): **Theorem A** (rank lemma: $\operatorname{rank} H^1 = \log_2|G| = \beta_1 - \dim\ker\bar\rho$, exact for e.a.2 holonomy) with **Lemma 1** (gauge-independence of $G$ up to conjugacy — discharges the spanning-tree-choice worry); **Theorem B** + **Corollary B.1** (the identification: nerve-cycle-non-trivial-monodromy $\iff$ out-of-$\mathcal{P}^\circ$-but-pairwise-in, reducing to T010; $H^1$ supported exactly on global cells; local obstructions off-nerve hence coboundary-trivial). The local system on the nerve is the formal object (Lemma 0: edges carry fiber bijections). Cross-check protocol: [`C015-verification-prompt.md`](../C015-verification-prompt.md). **Cross-checked + signed off 2026-06-08 (D1 returned, repaired, re-check cleared) → graduated as [T011](../02_THEOREMS_AND_PROOFS/T011-possibilistic-cohomology-iso-monodromy.md).**
- **Resolved (realistic witness, 2026-06-08):** beyond the abstract `seed-contextuality` twist, `seed-real` authored a **substantively meaningful** witness — a **Condorcet cycle of evaluation framings** (Carbon Tax vs Cap-and-Trade under cost-efficiency / political-durability / distributional-equity; each pairwise translation a defensible ranking-equivalence, the loop reversing on equity-vs-efficiency, so no consistent global ranking). `cech` returns **$H^1$ rank $=1$, $G\cong\mathbb{Z}/2$**, with the organic local drop still correctly off-nerve. This shows the phenomenon is **real and meaningful, not an artifact of the twist** — every claim a genuine policy proposition, every functor map a translation an analyst would author. Still *seeded* (not emergent from independent user activity), so it strengthens the construction corroboration; the organic witness stays the open rider. The witness persists in the DB (tagged `[plexus-probe]`, inspectable in `/agora`).
- **Resolved (cross-check + D1 repair, 2026-06-08):** the non-author cross-check ([`C015-verification-prompt.md`](../C015-verification-prompt.md)) re-derived Theorems A/B + Lemma 1 and confirmed them, but returned **one blocking defect D1** (the exact failure mode the prompt named): Lemma 0 grounded its fiber + edge-bijection on the assumption-ignoring `interDerivable` *proxy* rather than the strict ECC iso `isIsoVia`. **The minimal repair has been applied** — §0/§0.1/Lemma 0 re-based on the strict `isIsoVia` / T010 $\mathcal{P}^\circ$-2-cycle (Lemma 0 now descends strict-iso-classes via T010's strict-1-functor lemma), `interDerivable`/`pairFaithful` demoted to corroboration; Theorems A/B/Lemma 1 carry through unchanged. The cross-check **discipline worked exactly as for T010/T007**: a real foundational gap the tests could not catch (the binary witnesses make probe and strict relation coincide) was caught by re-derivation. **Re-check signed off 2026-06-08: D1 closed, no new defect → graduated as [T011](../02_THEOREMS_AND_PROOFS/T011-possibilistic-cohomology-iso-monodromy.md) (`status: established`), closing Q-043 (i)+(ii).**
- **Next concrete step:** **sub-program B's symbolic spine is complete** (B-exp → B-poss-0 → B-poss-1 → rank argument → paper proof → T011). The remaining frontier is empirical/strategic: (a) the **organic** live witness (Q-043(iii); the realistic seeded witness corroborates the construction but is not emergent), and (b) **B-abelian** — the quantitative $\mathbb{R}$-valued $H^1$, gated behind the per-edge-weight *meaning* decision (Q-042 offshoot), a modelling commitment. Both are deliberate forks, not in-hand next steps.
