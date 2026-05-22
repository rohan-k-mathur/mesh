# LUDICS_SESSION_2_DEV_SPEC — Archived Sections

**Purpose.** Provenance archive for Session 2 spec sections that have been
superseded by post-spec substrate work (Phase 2e proof + Phase 2f
pre-session). These sections are preserved verbatim so reviewers can trace
the spec's pre-resolution framing, but they are **no longer the
authoritative dev contract**. See linked replacements in each section.

**Archived on:** 2026-05-21 (during Sessions 1 & 2 spec-quality review).

---

## Archived §5 — Phase 2e — Formal Proof Pass (OQ-JSL)

**Why archived.** This section was written 2026-05-20 as a planning prompt
for the OQ-JSL proof. The proof was executed 2026-05-21 and produced
**Outcome B — mis-attribution with structural refinement**, an outcome
the section's binary "confirm / counterexample-with-flag" branching did
not anticipate. Following §5.2 verbatim would have produced a misleading
C1 update.

**Replacement.** The actual proof and its consequences (Inc(B) is an
antichain; ∨_⊥⊥ is per-cone; (B, ≤_⊆) decomposes into disjoint cones)
are the authoritative record:

- [LUDICS_OQ_JSL_PROOF.md](./LUDICS_OQ_JSL_PROOF.md) — proof + structural refinement
- [LUDICS_ORDER_RELATION_DEFINITION.md](./LUDICS_ORDER_RELATION_DEFINITION.md) — Phase 2f pre-session pinning ≤_⊆ as literal chronicle-set inclusion (Reading A), Daimon Lock Lemma
- [LUDICS_CONSOLIDATION_AND_DEV_READINESS.md](./LUDICS_CONSOLIDATION_AND_DEV_READINESS.md) — C1 downgraded to "Corrected"

**Verbatim archived text** follows.

---

### §5.1 Purpose

`compute_articulation_join` is specifiable and implemented from C1/C2 alone.
But the algebraic guarantee that the result is correct for **all** inputs
depends on whether $(\mathsf{Inc}(B), \leq_\subseteq, \vee_{\perp\perp}, |B|)$
is a join-semilattice — i.e., that the join operation is well-defined
(associative, commutative, idempotent, and has a bottom).

The current C1 status is "Tier 1 confirmed-with-caveat." The caveat: the
proof in the literature covers the full coherence-space setting; the
restriction to finitely-generated behaviour-closed designs in Isonomia's
use case may not be explicitly stated in any source.

### §5.2 What to prove (or disprove)

**OQ-JSL target:** For any behaviour $B$ in the Ludics substrate, and any
two designs $D_1, D_2 \in \mathsf{Inc}(B)$:

$$D_1 \vee_{\perp\perp} D_2 = (D_1 \cup D_2)^{\perp\perp} \in \mathsf{Inc}(B)$$

and this join is the **least upper bound** of $D_1$ and $D_2$ under
$\leq_\subseteq$.

This requires showing:
1. $(D_1 \cup D_2)^{\perp\perp}$ is always a design in $\mathsf{Inc}(B)$ —
   i.e., biorthogonal closure of a union of designs stays in $B$
2. No design $D' \in \mathsf{Inc}(B)$ with $D_1 \leq D' \leq D_1 \vee D_2$
   exists that is not equal to $D_1 \vee D_2$ — i.e., the result is the
   **least** common extension

**If confirmed:** Strengthen C1 to "Tier 1 fully confirmed" in
`LUDICS_CONSOLIDATION_AND_DEV_READINESS.md`. Remove `confirmed-with-caveat`
from all C1-backed tool documentation in the Session 1 spec's §1.

**If a counterexample is found:** The `compute_articulation_join` output
schema must add a fourth case beyond `{ join, newLoci, closureSteps }`:

```typescript
// Additional field:
joinIsMinimal: boolean;
// false when the returned design is an upper bound but not provably least
```

And surface the `incomparable` flag (currently only on `compress_articulation`)
alongside `compute_articulation_join` output.

### §5.3 Reference materials

1. Girard, J.-Y. (2001). "Locus Solum." *Mathematical Structures in Computer
   Science*, 11(3). — Biorthogonal closure in the coherence-space setting.
2. Melliès, P.-A. (2009). "Categorical Semantics of Linear Logic." §4
   (Behaviour spaces and closure operators).
3. `LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md` — current
   Isonomia-specific proof sketch.
4. `LUDICS_OPEN_COMPOSITION_JOINT.md` — the OQ-JSL problem statement as
   originally recorded.

### §5.4 Output

This phase produces a **proof document** (or a formal counterexample), not
code. The primary output is a new file:

```
Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/
  LUDICS_OQ_JSL_PROOF.md
```

Secondary output (if proof is confirmed): targeted edits to
`LUDICS_CONSOLIDATION_AND_DEV_READINESS.md` upgrading the C1 tier annotation.

**This phase is deferred** and does not block any of §1–§4. It should be
undertaken in a dedicated conceptual-track session after §1–§3 are complete.

---

*End of archived sections. See [LUDICS_SESSION_2_DEV_SPEC.md](./LUDICS_SESSION_2_DEV_SPEC.md) for the active spec and [LUDICS_SESSIONS_1_2_SPEC_REVIEW.md](./LUDICS_SESSIONS_1_2_SPEC_REVIEW.md) for the full review record.*
