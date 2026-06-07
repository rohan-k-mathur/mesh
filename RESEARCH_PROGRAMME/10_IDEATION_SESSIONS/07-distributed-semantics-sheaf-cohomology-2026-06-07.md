# Session 07 — Planning Direction 4: distributed semantics & the sheaf-theoretic cohomology of disagreement

**Date:** 2026-06-07
**Direction:** 4 — Distributed semantics (`09_FUTURE_DIRECTIONS_BRAINSTORM.md` §4)
**Status:** **Planning / scoping OPEN** (no theorems claimed; no code changed)
**Purpose:** turn the §4 narrative — *bicategory coherence first, sheaf-cohomology after* — into an executable research-and-development plan, grounded in the transport machinery that already exists in the repo.

---

## 0. The headline reframe: the one-hop contract is a guardrail, not a wall

Direction 4 is **not** greenfield. As in [Session 02](02-foundational-bridge-dung-ludics-2026-06-02.md), both ends of the work already exist in code; the missing piece is the *theorem that turns an asserted contract into a consequence*, not the endpoints.

The load-bearing object here is **the one-hop transport contract itself**. The audit question, stated sharply:

> Is the obstruction to $A\to B\to C$ transport **categorical** (the functors genuinely don't compose) or **provenance-engineering** (they *do* compose as partial claim-maps, but the `local / imported / total` band loses auditability to a single source room)?

**Strong prior from the code:** it is *provenance-engineering, not categorical.* The `Functor` interface in
[`lib/argumentation/ecc.ts`](../../lib/argumentation/ecc.ts) is just `mapClaim(id): string | null` — a **partial function on claims** — and partial functions compose associatively. The existing one-hop composition-preservation invariant is already asserted and tested:

| What | Where | Note |
|------|-------|------|
| `Functor` (object-level claim map) | [`lib/argumentation/ecc.ts`](../../lib/argumentation/ecc.ts) | `mapClaim(id): string \| null`, backed by `RoomFunctor.claimMapJson` |
| `transport(F, arrow)` | [`lib/argumentation/ecc.ts`](../../lib/argumentation/ecc.ts) | `@invariant` one-hop composition preservation (minimal-assumption set) |
| `aggregateAcrossRooms(local, imported[])` | [`lib/argumentation/ecc.ts`](../../lib/argumentation/ecc.ts) | `Hom_B(I,ψ) = Hom_B^local ∨ ⋁_F F(Hom_A(I,φ))`, log-odds fold |
| One-hop composition test | [`tests/ecc.test.ts`](../../tests/ecc.test.ts) | `transport(F, compose(g,f))` ≡ `compose(transport(F,g), transport(F,f))` on minimal assumptions |
| Materialized snapshots | `workers/transport-aggregator.ts` → `RoomTransportSnapshot` | one-hop by contract (ECC plan §4 row 2) |
| Read surfaces | `app/api/v3/deliberations/[id]/ecc/{transport,aggregate}` + MCP `ecc_transport`, `ecc_aggregate` | honest-empty on no inbound functors |

**Consequence for planning:** "we won't fake functor composition" is a *conservative default*, not an impossibility claim. The coherence theorem is therefore **attainable**, and its real content is **characterizing when the guardrail can be safely lifted** — not inventing composition from scratch.

This makes a **differential-testing-first** strategy viable (the Session 02 lever), and it is the single biggest de-risking move available.

---

## 1. Sub-program A — coherence, made concrete

Do *not* approach this as an abstract Mac Lane pentagon exercise. State it as a **characterization of safe composition**:

> **Coherence theorem (target shape).** Characterize the sub-bicategory of Plexus on which transport functors compose strictly (or with controlled lax 2-cells) *and* the `local/imported/total` provenance band stays auditable to a single source. On that region, $A\to B\to C$ is sound; off it, the one-hop contract is the correct default.

### 1.1 The three concrete drift sources (the theorem's hypotheses)

1. **Partiality misalignment.** `claimMapJson` is human-authored. Two hops compound authoring error multiplicatively even though composition is associative — semantic faithfulness ("does $\varphi_C$ really mean $\varphi_A$?") degrades, not the algebra.
2. **Double-counting in the log-odds fold.** `aggregateAcrossRooms` corroborates imported support in log-odds space, "auditable to a single source room." Re-importing B's already-imported support into C mixes B-local with A-via-B — **this is the real reason for one-hop**, and it is bookkeeping, not impossibility.
3. **Lossy (lax) functors.** The "premise structure lost" gap (CHUNK_5B; [`CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md) §5.2) means $F,G$ are **lax**, not strict. Coherence is precisely about when laxity composes — i.e. the 2-cells.

### 1.2 The crux: the missing 2-cells

The Plexus diagram leaves natural transformations "for future work," but the coherence theorem *needs* them. Concretely a 2-morphism $F \Rightarrow F'$ is an **alternative claim-alignment between the same room pair** (`claimMapJson` is non-unique). Naming and implementing these is the load-bearing engineering step.

### 1.3 Phasing for A (cheap → gated)

- **A0** — the contract audit above (paper + `lib/argumentation/ecc.ts`, `tests/ecc.test.ts`, the aggregator). Output: *categorical vs provenance* verdict.
- **A1** — extend [`tests/ecc.test.ts`](../../tests/ecc.test.ts) with a genuine **two-functor** law: `transport(G, transport(F, a))` vs `transport(compose(G,F), a)`, where `compose(G,F)` is partial-map composition of claim-maps. Expectation: holds at the arrow level; the interesting failures live at the **aggregation/band** level.
- **A2** — define the 2-cells (claim-map realignments), state the coherence theorem, promote to a conjecture + open question. The composition law is small enough to mechanize in Agda (Direction 5 synergy).

---

## 2. Sub-program B — cohomology, and the strongest insight here

The brainstorm names Abramsky's contextuality-as-cohomology as the template. Push one step further on *which* cohomology — and Direction 3 hands us a gift.

> **Approach the obstruction as a discrete connection / holonomy on the Plexus graph with $\mathbb{R}$-valued (log-odds) coefficients — not full Grothendieck-topos sheaf cohomology, at least not first.**

### 2.1 Why $\mathbb{R}$-valued $H^1$ is the right first target

- Direction 3 ([Session 01](01-confidence-algebra-semiring-vs-quantale-2026-06-02.md)) settled confidence as the **log-odds** semiring: $w = \log\frac{c}{1-c} \in \mathbb{R}$, corroboration $=$ **addition in $\mathbb{R}$**. So the natural coefficient object for Čech cohomology is $\mathbb{R}$ (an honest abelian group), giving **real-valued $H^1$** — a *quantitative* obstruction whose **magnitude measures how much irreducible disagreement exists**, not merely present/absent.
- A transport edge applies an $\mathbb{R}$-valued shift; around a cycle $A\to B\to C\to A$ the log-odds shifts sum. **Zero sum $\Rightarrow$ the disagreement glues (consistent); nonzero $\Rightarrow$ a non-trivial $H^1(\mathbb{R})$ class whose size is the net inconsistency around the loop.** This is a **discrete connection**: transports are the connection, disagreement is the holonomy/curvature, $H^1$ is the obstruction to flatness.
- It is **tractable** (linear algebra over $\mathbb{R}$: cycle space mod coboundary image), **computable directly from `RoomTransportSnapshot` data**, **quantitative**, and **recognizable** (Condorcet cycles, holonomy).

### 2.2 Structural fact worth recording (vindicates a Direction-3 cost)

The two confidence modes correspond to the two cohomology flavours:

- the parked idempotent **min-quantale** gives the *possibilistic* (Abramsky boolean) obstruction;
- the chosen **log-odds** semiring gives the *abelian, quantitative* one.

The "park the enrichment prize" decision is precisely what buys the clean abelian coefficient group here. (Status: **conjecture** — the precise functor from modes to coefficient objects is not yet checked against the reducers.)

### 2.3 Minimal viable witness

A **Condorcet 3-cycle** — three rooms pairwise-compatible but globally inconsistent — realized as a non-trivial $H^1(\mathbb{R})$ class computed from real snapshot data. Small, canonical, recognizable.

### 2.4 Why the settled sequencing is more than hygiene

Holonomy around $A\to B\to C\to A$ is **undefined** until $A\to B\to C$ composition is coherent. The sequencing is literally *"define the connection before computing its curvature."* That is a cleaner justification than "you can't glue over an incoherent site," and should be added to the §4 note.

---

## 3. The existential risk to check *first* (cheapest, highest-information)

Before any theory: **measure whether the real Plexus is connected enough to have non-trivial cohomology at all.**

A read-only study over `RoomFunctor` / `RoomTransportSnapshot` / the five meta-edge tables for:

1. **connectivity** — is the meta-graph a forest, or does it have cycles?
2. **claim-overlap density** — do mapped claims actually co-occur enough to transport?
3. **count of $\ge 3$-cycles** — the candidate carriers of non-trivial $H^1$.

If the live graph is essentially a **forest**, then $H^1 = 0$ trivially and the entire sub-program B is vacuous *on current data*. This is a one-afternoon empirical study that can kill or greenlight sub-program B — exactly the de-risking discipline of Session 02.

> **Caveat noted this session (2026-06-07):** the Plexus features have not been exercised much yet, so the live tables are likely sparse. The empirical study therefore has a **prerequisite seeding step**: run the transport workflow ([`app/test/plexus-features`](../../app/test/plexus-features/page.tsx), `/api/room-functor/*`, `/functor/transport`) across a handful of real rooms to populate `RoomFunctor` + `RoomTransportSnapshot` before the topology query can say anything. Seeding-then-measuring is itself the first concrete task.

### 3.1 Artifact + result (run 2026-06-07)

The seed+measure study is now a runnable harness:
[`scripts/plexus-topology-probe.ts`](../../scripts/plexus-topology-probe.ts) (`seed` | `measure` | `clean` | default = both). It seeds a 3-room functor cycle $A\to B\to C\to A$ with *supported* mapped claims (so the cycle carries evidence, not just a graph edge), writes snapshots through the **pure** aggregator lib (no worker `setInterval` side-effect), then prints a whole-Plexus topology report: cyclomatic number $\beta_1 = E-V+C$ (candidate graph-level $H^1$ rank), directed 2-/3-cycle counts, per-functor claim-overlap density, snapshot payload sizes, and the five-table meta-edge census.

**Headline empirical finding — sub-program B is NOT vacuous on current data.** The live Plexus was *already not a forest before seeding*: the measure pass reported pre-existing mutual functor pairs (directed 2-cycles) and triangles, so the existential risk in §3 is **retired**. After seeding the probe cycle:

- $V = 13$ rooms, 15 directed functors, $C = 3$ components, $\boxed{\beta_1 = 3}$ (was $\ge 2$ from pre-existing data alone);
- directed **3-cycles = 3** (probe added 1; **2 pre-existed** in real data);
- claim-overlap density overall **64%** of mapped claims carry evidence (the realistic "mapped but partially empty" regime — some functors map claims with no source-side `ArgumentSupport`, which the aggregator silently drops);
- **3/3** probe snapshots non-empty ⇒ the seeded cycle genuinely carries evidence.

**Verdict (from the harness):** *graph has cycles ($\beta_1 = 3$) AND snapshots carry evidence ⇒ candidate non-trivial $H^1$; sub-program B is well-posed on current data; proceed to the $\mathbb{R}$-valued discrete-holonomy framing (sum log-odds shifts around each 3-cycle).*

> **Caveat on the $\beta_1$ reading.** $\beta_1$ is the **unlabelled graph** Betti number — an *upper bound* on the rank of the evidence-sheaf $H^1$, not $H^1$ itself. The real cohomology is computed with the $\mathbb{R}$-valued (log-odds) cochain: a cycle only carries a non-trivial class if the summed log-odds holonomy around it is **non-zero**. Computing that per-3-cycle holonomy from the snapshot payloads is **phase B2b**, and it is the first thing to build now that 0b is green.

### 3.2 B2b result — holonomy is exact; the real obstruction is claim-map monodromy (run 2026-06-07)

The `holonomy` subcommand of [`scripts/plexus-topology-probe.ts`](../../scripts/plexus-topology-probe.ts) implements the per-cycle computation in **two honest layers**, because the mathematics forces it:

- **Why a one-layer $\mathbb{R}$-holonomy is vacuous.** Any connection defined as a *difference of node potentials* (here: target-minus-source log-odds for the tracked claim) is a **coboundary** $\delta w$, so its holonomy around any loop telescopes to $0$ *by construction*. A non-trivial $H^1(\mathbb{R})$ class needs an **edge datum independent of the nodes** — which the current schema does not carry (`claimMapJson` is just `{fromClaimId: toClaimId}`, no per-edge transport weight).
- **Layer 1 — claim-map monodromy (the schema-supported obstruction).** Track a claim through the claimMap composite around the cycle: **closed** (returns to itself), **drifted** (returns to a *different* claim), or **dropped** (a partial functor has no image). Drift/drop is a genuine $H^1$ carrier on current data — and is *exactly* a sub-program A coherence failure.
- **Layer 2 — $\mathbb{R}$-holonomy, only for claim-closed loops.** Compute $\sum_i (w_{i+1}-w_i)$ (confirms exactness $\approx 0$) and report the log-odds **spread** $(\max-\min)$ as the *local* disagreement magnitude — which has a locus, so it belongs to **Direction 2**, not to a global class.

**What the run found (5 cycles over live + probe data):**

| Cycle | Result |
|------|--------|
| probe $A\to B\to C\to A$ (seeded, supported) | **3 closed**, holonomy $=0.000000$ (exact), spread $=0.000$ — clean consistent baseline, validates layer 2 |
| real `cmew2n5l→cmetdvon→cmfdbq3u→…` | **1 DROPPED at hop 2** — a genuine claim-map monodromy obstruction in *pre-existing* data |
| three real cycles | empty `claimMap` on the first edge — **"present but empty" functors** (edge exists, maps nothing) |

**Tally:** closed $=3$, drifted $=0$, dropped $=1$; **non-trivial monodromy $=1$**; **non-zero $\mathbb{R}$-holonomy $=0$** (exactly as the coboundary argument predicts).

**B2b finding (resolved this session):** on current data Direction 4's global obstruction **collapses entirely onto the claim-map monodromy** — i.e. onto sub-program A's coherence question. The $\mathbb{R}$-holonomy is exact (no quantitative global class) because the schema has no independent per-edge datum. Two consequences:

1. **This vindicates "coherence first" empirically, not just rhetorically:** the only non-trivial obstruction the live Plexus carries today *is* a coherence failure (a dropped claim-map composite). There is nothing for the quantitative sheaf machinery to bite on until either (a) coherence is repaired so more loops are claim-closed, or (b) the schema gains a per-edge transport weight.
2. **Concrete schema ask (new, feeds B2c / sub-program A):** to obtain a genuinely *quantitative* $H^1(\mathbb{R})$ class distinct from monodromy, `RoomFunctor` needs an **independent per-mapping transport weight** (a log-odds shift the edge asserts, not derivable from node beliefs). Without it, the abelian cohomology is always exact and the only signal is the boolean/possibilistic monodromy.



---

## 4. Cross-direction synergies (record these)

- **Direction 2 (separation/locus).** Local disagreement has a *locus* (the minimal-disagreement-extractor, [`DEV_SPEC-minimal-disagreement-extractor-2026-06-04.md`](../DEV_SPEC-minimal-disagreement-extractor-2026-06-04.md)). Direction 4's $H^1$ is disagreement with **no local locus** — it lives in the gluing. Clean division of labour: local instrument vs global invariant.
- **Direction 1 (behaviours $B=B^{\perp\perp}$).** The sheaf's local sections *are* the bi-orthogonal behaviours. §1's "closed deliberation vs constitutively-needs-import" question **is** the presheaf-vs-sheaf / $H^0$-locality question — the same distinction.
- **Direction 5 (mechanization).** Both the composition law (A2) and the cocycle condition (B) are small and Agda-able.

---

## 5. Proposed phase map

| Phase | Work | Gate |
|------|------|------|
| **0a** | One-hop contract audit: categorical vs provenance | none |
| **0b-seed** | Seed `RoomFunctor` + `RoomTransportSnapshot` via the transport workflow on real rooms | none — ✅ **done** ([`scripts/plexus-topology-probe.ts`](../../scripts/plexus-topology-probe.ts)) |
| **0b-measure** | Empirical Plexus-topology study (connectivity, overlap, 3-cycles) | ✅ **done 2026-06-07 — GREEN** ($\beta_1=3$, 3-cycles, snapshots non-empty; live graph already non-forest) |
| **A1–A2** | Two-functor composition law + 2-cells + coherence conjecture | **A0 ✅ + A1 ✅ + A2 ✅ done 2026-06-07** — 2-cells defined, coherence theorem stated as [C014](../03_CONJECTURES/C014-plexus-transport-pseudofunctor.md) / [Q-042](../01_OPEN_QUESTIONS_REGISTRY.md#q-042) |
| **B2a** | Discrete-connection / $\mathbb{R}$-holonomy framing | needs A |
| **B2b** | Per-cycle log-odds **holonomy** + claim-map **monodromy** on real data | ✅ **done 2026-06-07** — holonomy exact ($=0$, coboundary); the only live obstruction is **monodromy** (1 dropped claim) = a coherence failure. Needs per-edge weight for a quantitative class. |
| **B2c** | Lift to full Grothendieck-site / stack version | only if a quantitative class appears (needs schema per-edge weight + A) |

---

## 6. Open forks (NOT resolved this session — honour the no-premature-premise discipline)

- **Coefficient object.** Abelian/log-odds ($\mathbb{R}$, quantitative) vs possibilistic/min-quantale (boolean, structural). Likely **both** are needed (§2.2); start abelian.
- **Granularity.** Graph-level holonomy vs full sheaf-over-a-site. Start **graph-level**; lift only if B2b warrants it.
- **The §2.2 mode→coefficient correspondence** is a **conjecture**, not a premise.

---

## 7. Decisions recorded this session

- **Resolved (framing):** the one-hop contract is a provenance guardrail, not a categorical wall — coherence is the characterization of *when it lifts*. (Subject to A0 audit confirming the prior.)
- **Resolved (target):** first cohomology target is $\mathbb{R}$-valued discrete holonomy on the Plexus graph, not full sheaf cohomology.
- **Resolved (sequencing rationale):** add "define the connection before its curvature" to §4 of the brainstorm as the operational reason coherence precedes cohomology.
- **Parked:** full Grothendieck-site/stack semantics (B2c) until a real non-trivial $H^1$ witness exists.
- **Resolved (empirical, 2026-06-07):** **0b is GREEN.** [`scripts/plexus-topology-probe.ts`](../../scripts/plexus-topology-probe.ts) shows the live functor graph is *already* non-forest ($\beta_1 = 3$, two pre-existing 3-cycles + the seeded one, snapshots non-empty). The existential risk that the whole sub-program is vacuous on current data is **retired**.
- **Resolved (B2b, 2026-06-07):** the $\mathbb{R}$-holonomy is **exact** ($\sum\delta w = 0$, a coboundary) on every claim-closed loop, because the schema carries no per-edge datum independent of node beliefs. The **only** non-trivial obstruction on live data is **claim-map monodromy** (a dropped composite) — i.e. Direction 4's global obstruction currently *collapses onto sub-program A coherence*. This empirically vindicates "coherence first."
- **New ask (feeds A / B2c):** a quantitative $H^1(\mathbb{R})$ class distinct from monodromy requires an **independent per-mapping transport weight** on `RoomFunctor`. Logged as a concrete schema proposal, not adopted.
- **Resolved (A0, 2026-06-07):** audit [`audits/a0-onehop-contract-laxity-vs-policy-2026-06-07.md`](../audits/a0-onehop-contract-laxity-vs-policy-2026-06-07.md) confirms the obstruction is **provenance, not categorical**. Object composition is associative (free); the symbolic arrow algebra is strict + idempotent (free, already multi-hop-safe); the *only* one-hop blocker is the **scalar log-odds band** losing source identity (`transportAggregator.reduceImportedScores` adds, can't dedupe by origin). Laxity is a **separate** axis living in **materialization** (`apply/route.ts` drops premise rows), not in the algebra. Decisive structural fact: `RoomTransportSnapshot.payloadJson.sources[]` *already* carries per-source provenance, so a coherence fix is small (carry the full path, dedupe by ultimate origin). The genuine categorical content is the **lax 2-cells (A2)**, nothing below it.
- **Resolved (A1, 2026-06-07):** four executable two-functor laws added to [`tests/ecc.test.ts`](../../tests/ecc.test.ts) (suite "A1 — two-functor composition"), all green (90/90). Object-level functor composition is defined **locally in the test**, deliberately **not** added to `lib/argumentation/ecc.ts` — shipping `composeFunctors` would imply endorsing multi-hop the scalar band can't yet support.
- **Resolved (A2, 2026-06-07):** the lax 2-cells are characterized and the coherence theorem is stated as conjecture [C014](../03_CONJECTURES/C014-plexus-transport-pseudofunctor.md) + open question [Q-042](../01_OPEN_QUESTIONS_REGISTRY.md#q-042). **Key identification:** a 2-cell $F\Rightarrow F'$ is a family of room-$B$ arrows witnessing two `claimMapJson` alignments are inter-derivable, and **B2b's claim-map monodromy *is* non-invertible 2-cell holonomy** (closed = identity 2-cell; drifted = non-iso; dropped = undefined). This unifies A0 + A1 + B2b as the three hypotheses of one coherence biconditional, and makes "coherence first" a theorem dependency: the quantitative $H^1(\mathbb{R})$ is only defined on the pseudofunctor sub-bicategory.
- **Next concrete step:** discharge C014 in order — (1) promote the A1 tests to a strict-1-functor lemma (near-done, Agda-able); (2) **path-provenance band + origin-dedupe property test** (the next concrete build, extends [`scripts/plexus-topology-probe.ts`](../../scripts/plexus-topology-probe.ts)); (3) the lax-functor coherence/pentagon proof (the genuine theorem). All production transport code stays unchanged until (3) lands; production fixes are gated decisions.
