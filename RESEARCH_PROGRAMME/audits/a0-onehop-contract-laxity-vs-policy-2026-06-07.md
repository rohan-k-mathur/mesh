# A0 — One-hop transport contract audit: *laxity* vs *one-hop policy*

**Date:** 2026-06-07
**Direction:** 4 — Distributed semantics, sub-program A (coherence) — see [`10_IDEATION_SESSIONS/07-distributed-semantics-sheaf-cohomology-2026-06-07.md`](../10_IDEATION_SESSIONS/07-distributed-semantics-sheaf-cohomology-2026-06-07.md)
**Status:** **Resolved** (audit; no production code changed)
**Audit question (from session 07, §0):** is the obstruction to $A\to B\to C$ transport **categorical** (the functors genuinely don't compose) or **provenance-engineering** (they compose, but the `local/imported/total` band loses auditability to a single source room)?

**Verdict: PROVENANCE, decisively.** The obstruction is *not* in the categorical algebra — it is two separable bookkeeping facts, both fixable, neither an impossibility. This confirms the session-07 prior: the one-hop contract is a **conservative guardrail, not a categorical wall.**

---

## 0. Method

Read the actual surfaces, not the prose:

| Surface | File | What it is |
|---|---|---|
| Object-level functor | [`lib/argumentation/ecc.ts`](../../lib/argumentation/ecc.ts) `Functor` | `mapClaim(id): string \| null` — a **partial function on claims** |
| Symbolic transport | [`lib/argumentation/ecc.ts`](../../lib/argumentation/ecc.ts) `transport` | relabels endpoints, **carries derivs/assumptions verbatim** |
| Symbolic aggregation | [`lib/argumentation/ecc.ts`](../../lib/argumentation/ecc.ts) `aggregateAcrossRooms` / `join` | **Set-union** of derivation sets |
| Scalar band | [`lib/argumentation/transportAggregator.ts`](../../lib/argumentation/transportAggregator.ts) `reduceImportedScores` / `combineLocalAndImported` | log-odds **addition** (corroboration), **no derivation identity** |
| Snapshot payload | `RoomTransportSnapshot.payloadJson` | `{ [toClaimId]: { sources: [{ fromRoomId, fromClaimId, score }] } }` |
| Materialized import | [`app/api/room-functor/apply/route.ts`](../../app/api/room-functor/apply/route.ts) | creates **fresh** `Argument` + `ArgumentSupport` rows |

---

## 1. Three findings that decide the verdict

### 1.1 Object-level composition is categorically fine (associative partial-function composition)

`Functor` is `mapClaim(id): string | null` — a partial function on claim ids. The composite $G\circ F$ is just
`id ↦ (F(id) === null ? null : G(F(id)))`, with null propagation. Partial functions compose **associatively and totally-where-defined**. There is no categorical obstruction at the object level. (Demonstrated by the A1 associativity test.)

### 1.2 The symbolic arrow algebra is *strict and idempotent* — it would NOT double-count under multi-hop

- `transport` is the **identity on derivation IDs** and assumption sets; it only relabels `from`/`to`. So it is a faithful, composition-preserving carry (the existing one-hop test in [`tests/ecc.test.ts`](../../tests/ecc.test.ts) already asserts this for a single functor; A1 extends it to two functors).
- `aggregateAcrossRooms` joins by **Set union** of derivation sets, which is **idempotent**: re-importing the same remote arrow twice yields the same derivation set. So at the *symbolic* level, multi-hop re-import of a shared source **dedupes by derivation identity** and does not inflate support. (Demonstrated by the A1 idempotence test.)

**Consequence:** the symbolic ECC layer is *already multi-hop-safe*. If transport lived only in the symbolic algebra, $A\to B\to C$ would be sound today.

### 1.3 The real obstruction: the **scalar band** loses derivation identity

The contribution the destination room actually displays is the *scalar* band, computed in [`transportAggregator.ts`](../../lib/argumentation/transportAggregator.ts): `reduceImportedScores` corroborates per-source scores (log-odds **addition**), and `combineLocalAndImported` folds them into `total`. This reducer carries **only a number**, not the derivation/source identity. So two hops that both ultimately carry A's support (A→C directly **and** A→B→C) would **add A twice** — the band cannot dedupe what the Set-union join dedupes symbolically.

**This — and only this — is the reason for one-hop:** keeping the `local/imported/total` band *auditable to a single source room* (exactly the README's wording). It is a property of the **scalar reducer**, not of the category.

---

## 2. The laxity axis is separate — and lives in *materialization*, not the algebra

The "premise structure lost ⇒ functoriality NOT satisfied" gap (CHUNK_5B §5.2; [`CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md) §5.2/§13.3) is a **different** claim from one-hop, and it attaches to a **different layer**:

- **Symbolic `transport`** (ecc.ts) is **strict** — identity on derivations, nothing lost.
- **Materialized import** ([`apply/route.ts`](../../app/api/room-functor/apply/route.ts)) creates a *fresh* `Argument` + `ArgumentSupport` and does **not** copy the source `ArgumentPremise` rows. *This* is where premise structure is dropped — i.e. the **materialized** functor is **lax**, not the symbolic one.

So the two "gaps" the architecture doc lists under one bullet are **orthogonal**:

| Axis | Layer | Status | Fix shape |
|---|---|---|---|
| **One-hop policy** | scalar band (`transportAggregator`) | conservative bookkeeping | carry source/path identity through the band so corroboration dedupes |
| **Laxity** | materialization (`apply/route.ts`) | genuine information loss | structure-preserving import (carry premise edges) ⇒ strict; else characterize the lax 2-cells |

Conflating them is what made one-hop look like a categorical limit. It is not.

---

## 3. The decisive structural fact: the band is *already* one-hop-auditable by construction

`RoomTransportSnapshot.payloadJson` already stores **per-source provenance**:
`byClaim[toClaimId].sources = [{ fromRoomId, fromClaimId, score }]`. So the data needed to attribute imported support to its origin **already exists at one hop**. The one-hop restriction is therefore *more conservative than the data structure requires*: multi-hop would need each `sources[]` entry to carry the **full transport path** (not just the immediate predecessor), after which the scalar band could dedupe by origin and the §1.3 double-count disappears.

That makes the coherence fix **small and concrete**, not a research mountain:

> **Coherence enabler (proposal, NOT adopted):** extend `sources[]` to carry the path `fromRoomId[]` (or a source-claim provenance chain), and dedupe corroboration by ultimate origin in `reduceImportedScores`. Then multi-hop transport preserves single-source auditability and the band stops double-counting.

---

## 4. Coherence theorem — hypotheses, now precisely stated

The session-07 target ("characterize the sub-bicategory on which transport composes without provenance drift") has these explicit hypotheses, each now mapped to a surface:

1. **(objects)** claim-maps compose — *free* (§1.1).
2. **(symbolic arrows)** transport is strict + join idempotent — *free* (§1.2).
3. **(scalar band)** corroboration dedupes by ultimate source — *requires the §3 path-provenance enabler*.
4. **(materialization)** import carries premise structure (strict) **or** the lax 2-cells $F\Rightarrow F'$ (alternative claim-map alignments) are characterized — *open; this is the genuine categorical content*.

Coherence holds on the sub-bicategory where (3) and (4) are met. Off it, **one-hop is the correct default** — the guardrail is doing exactly its job.

---

## 5. What this means for the program

- **Confirms** the session-07 framing and the empirical B2b finding: the live obstruction is **coherence** (claim-map monodromy), and coherence is reachable — its hard core is (4), the lax-2-cell characterization, not (1)–(3).
- **Production files a coherence fix would touch** (flagged, not edited — gated decision per this session): `lib/argumentation/transportAggregator.ts` (band dedupe + path provenance), `RoomTransportSnapshot.payloadJson` shape (`sources[]` → path), `app/api/room-functor/apply/route.ts` (structure-preserving materialization). The symbolic `lib/argumentation/ecc.ts` surface stays **unchanged** and keeps the one-hop contract documented.
- **A1** (next) demonstrates findings §1.1–§1.2 as executable tests, deliberately defining two-functor composition **locally in the test** and **not** adding `composeFunctors` to the production ECC surface — shipping it would imply endorsing multi-hop, which the band (§1.3) does not yet support.

---

## 6. One-line verdict

> The one-hop contract is a **scalar-band provenance guardrail**, not a categorical wall. Object composition and the symbolic arrow algebra already support multi-hop; the only blockers are (a) the scalar reducer's loss of source identity — fixable via path provenance the snapshot half-carries already — and (b) lossy re-materialization. Coherence's real content is the lax-2-cell characterization (hypothesis 4), nothing below it.
