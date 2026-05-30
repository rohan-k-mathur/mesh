# Schemes — Implementation Specs Overview

- **status:** draft (architectural preamble; spec index)
- **owner:** schemes track
- **depends-on:** [`SCHEMES_ONTOLOGY_DECISION.md`](SCHEMES_ONTOLOGY_DECISION.md), [`SCHEMES_THEORETICAL_FOUNDATIONS.md`](SCHEMES_THEORETICAL_FOUNDATIONS.md), [T003](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md)
- **last-reviewed:** 2026-05-27

This document is the **architectural preamble and spec index** for the
schemes-implementation track. It does not specify any single component;
it explains the decomposition into five sibling spec documents, the
shared premises they rely on, the migration posture they collectively
adopt, and the ordering in which they should be implemented.

> **Read this once to orient.** Then read the spec for whichever surface
> you are about to ship against. Specs assume the reader has read this
> overview; they do not re-derive the premises.

---

## §1 Premises (load-bearing, taken from the research programme)

Every implementation decision in the sibling specs is downstream of the
following five premises. If any of these is in doubt, that doubt
escalates to the research programme, not to spec revision.

### P1 — Layered scheme ontology (Outcome A, decided 2026-05-27)

A scheme is the product datum

$$
S \;=\; \bigl\langle \llbracket S \rrbracket,\; \mathcal{S}_S,\; \pi_S \bigr\rangle
$$

over a shared CQ-bundle $\mathrm{CQ}(S)$, where $\llbracket S \rrbracket$
is the C006 behaviour (semantic ground truth), $\mathcal{S}_S$ is the
C007 presentation (structural), $\pi_S$ is the C008 protocol
fragment (procedural). The three layers are **complementary, not
rival**. See [`SCHEMES_ONTOLOGY_DECISION.md`](SCHEMES_ONTOLOGY_DECISION.md)
and [T003](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md).

### P2 — Soundness as a runtime invariant, not a database constraint

The presentation→behaviour map $\mathcal{B}$ and the protocol→behaviour
map $\mathcal{P}$ satisfy

$$
\mathcal{B}(\mathcal{S}_S) \;=\; \llbracket S \rrbracket
\qquad
\mathcal{P}(\pi_S) \;\subseteq\; \llbracket S \rrbracket.
$$

The first equality is a *creation-time well-formedness rule* (admin
surface, [Spec 2](SCHEMES_IMPL_ADMIN_TIGHTENING.md)); the second
inclusion is a *play-time invariant* (runtime surface,
[Spec 3](SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md)). They cannot be enforced
by the same mechanism.

### P3 — Non-injectivity of $\mathcal{B}$ is a UX problem, not a bug

The presentation→behaviour map is many-to-one. Two admins can
independently create different-looking schemes with the same
behaviour. There is no canonical-form route to deduplication ([Q-021](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md)
forecloses route (a) via T003's non-injectivity argument). The
substrate needs a **certificate-based verifier**
([Spec 4](SCHEMES_IMPL_VERIFIER.md)).

### P4 — `inheritCQs: false` is incoherent and must be retired or reclassified

Suppressing parent CQs enlarges the child's behaviour, reversing the
inheritance direction $\llbracket S' \rrbracket \subseteq \llbracket S \rrbracket$.
See [Q-012 resolution](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md)
and [`SCHEMES_ONTOLOGY_DECISION.md`](SCHEMES_ONTOLOGY_DECISION.md) §6.3.
The shape of the retirement depends on the [Q-019 audit](SCHEMES_IMPL_AUDIT_PROTOCOLS.md#q-019)
results.

### P5 — Three layers are conceptual now, materialised later

The data model keeps a single `argument_scheme` row per scheme; the
three layers are lenses over its fields (validator code, runtime
checkers, verifier components). The schema is **not** split into
`scheme_behaviour` / `scheme_presentation` / `scheme_protocol` tables
in this implementation phase. The upgrade path to materialised layers
is preserved (see [§4](#§4-migration-posture-matrix)) but not exercised
until at least Q-018 and Q-019 audits are complete.

---

## §2 Spec index

| # | Spec | Surface | Layer | Status |
|---|------|---------|-------|--------|
| 1 | [this document](SCHEMES_IMPL_OVERVIEW.md) | architectural preamble | — | draft |
| 5 | [SCHEMES_IMPL_AUDIT_PROTOCOLS.md](SCHEMES_IMPL_AUDIT_PROTOCOLS.md) | data-producing audits (Q-018/Q-019/Q-020) | all | draft |
| 2 | [SCHEMES_IMPL_ADMIN_TIGHTENING.md](SCHEMES_IMPL_ADMIN_TIGHTENING.md) | authoring (`SchemeCreator`, `argument_scheme` schema) | C007 | draft |
| 3 | [SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md](SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md) | runtime / room protocol | C008 | draft |
| 4 | [SCHEMES_IMPL_VERIFIER.md](SCHEMES_IMPL_VERIFIER.md) | behaviour-equality, non-redundancy UI, AIF round-trip | C006 | draft |

**Implementation order:** 1 (this) → 5 (audits) → 2 / 3 / 4 in parallel.
The audits in spec 5 produce the data that specs 2/3/4 consume to
decide migration shape, retirement scope, and acceptance criteria.

---

## §3 Three-surface decomposition

Each spec corresponds to exactly one of the three layers. The mapping
is **vertical, not horizontal**: spec 2 owns the C007 surface
*end-to-end* (schema, admin UI, validator), not "the admin part of all
three layers". This is deliberate: it makes the soundness boundary
between surfaces explicit and forces the verifier (spec 4) to treat
the other two surfaces as black boxes.

```text
                      ┌───────────────────────────────────────┐
                      │   Spec 4: Verifier (C006 surface)     │
                      │   - behaviour-equality decision       │
                      │   - non-redundancy admin UI           │
                      │   - AIF round-trip identity discipline│
                      └───────────────┬───────────────────────┘
                                      │ consumes presentations
                                      │ from C007, protocols
                                      │ from C008
                      ┌───────────────┴────────────────┬──────────────────────────┐
                      ▼                                ▼                          │
       ┌──────────────────────────┐      ┌────────────────────────────┐           │
       │ Spec 2: Admin Tightening │      │ Spec 3: Protocol Soundness │           │
       │ (C007 surface)           │      │ (C008 surface)             │           │
       │ - argument_scheme schema │      │ - room protocol clauses    │           │
       │ - SchemeCreator UI       │      │ - CQ-locus obligations     │           │
       │ - creation-time well-    │      │ - play-time soundness      │           │
       │   formedness rules       │      │   invariant                │           │
       │ - inheritCQs retirement  │      │ - latent-stratum UI        │           │
       └─────────────┬────────────┘      └────────────┬───────────────┘           │
                     │                                │                           │
                     └────────────────┬───────────────┘                           │
                                      │ both consume                              │
                                      ▼                                           ▼
                      ┌───────────────────────────────────────────────────────────┐
                      │   Spec 5: Audit Protocols                                 │
                      │   - Q-019: inheritCQs: false catalogue audit              │
                      │   - Q-018: OntoClean meta-property matrix                 │
                      │   - Q-020: external-catalogue field comparison            │
                      └───────────────────────────────────────────────────────────┘
```

**Why vertical decomposition.** A horizontal split ("data model spec",
"UI spec", "runtime spec") would force every spec to take a position
on all three layers and would re-introduce the cross-layer confusion
the verdict just resolved. Vertical decomposition keeps each spec's
soundness conditions local: spec 2 owns the equality
$\mathcal{B}(\mathcal{S}_S) = \llbracket S \rrbracket$; spec 3 owns the
inclusion $\mathcal{P}(\pi_S) \subseteq \llbracket S \rrbracket$; spec
4 owns the decision procedure for $\llbracket S \rrbracket = \llbracket S' \rrbracket$.

---

## §4 Migration posture matrix

Each downstream spec must declare a migration posture per affected
admin behaviour. The postures are:

- **Greenfield** — new surface, no existing data or behaviour to
  migrate. Ship as a single PR.
- **Additive** — new check or capability that runs alongside existing
  behaviour. Two-phase rollout: (a) warn-only, (b) enforce after a
  named soak period.
- **Breaking** — existing behaviour changes semantics or is removed.
  Three-phase rollout: (a) deprecation notice + audit, (b) data
  migration, (c) removal.

| Behaviour affected | Posture | Spec | Notes |
|---|---|---|---|
| Behaviour-equality verifier | Greenfield | 4 | New endpoint; no existing data |
| Non-redundancy admin UI | Greenfield | 4 | New widget on `SchemeCreator` |
| AIF round-trip identity check | Additive | 4 | Currently silent merge; add warning then error |
| Soundness invariant at instance-close | Additive | 3 | Currently absent; add warning then error |
| Latent-stratum surface in room UI | Greenfield | 3 | New UI element; no existing data |
| Protocol clauses (`burdenOfProof` / `requiresEvidence` / `premiseType`) as runtime checks | Additive | 3 | Currently metadata; add runtime enforcement opt-in then default-on |
| CQ-bundle consistency check at creation | Additive | 2 | Currently no check; add warning then error |
| Non-vacuity check at creation | Additive | 2 | Currently no check; add warning then error |
| `inheritCQs: false` flag | **Breaking** | 2 | Retirement gated on Q-019 audit; data migration required |
| Scheme versioning (`argument_scheme_version` table) | Deferred | 2 | Spec must declare deferral and document the shape it would take |
| Materialised layered schema (`scheme_behaviour` / `scheme_presentation` / `scheme_protocol` tables) | Deferred | — | Documented in this overview; not specified until Q-018 + Q-019 data lands |

**The single breaking change is `inheritCQs: false`.** Its cost is
gated on the [Q-019 audit](SCHEMES_IMPL_AUDIT_PROTOCOLS.md#q-019)
output. If the audit finds zero or single-digit uses in the production
catalogue, the breaking change is cheap; if it finds widespread use,
spec 2 must propose a sibling/synonym reclassification before
retirement.

---

## §5 Implementation sequencing

```text
[Spec 1 — this overview]
       │
       ▼
[Spec 5 — Audit Protocols]
   ├── Q-019 audit data ──────────────────┐
   ├── Q-018 OntoClean matrix ────────────┤
   └── Q-020 external-field comparison ───┤
                                          │
        ┌─────────────────────────────────┤
        ▼                                 ▼
[Spec 2 — Admin Tightening]    [Spec 3 — Protocol Soundness]
        │                                 │
        └───────────────┬─────────────────┘
                        ▼
                [Spec 4 — Verifier]
                (depends on stable presentations
                 from spec 2 and stable protocols
                 from spec 3)
```

**Why spec 5 first.** Three of the four downstream specs have
acceptance criteria that depend on audit output:

- Spec 2's `inheritCQs: false` retirement plan needs the Q-019 count
  and classification.
- Spec 2's well-formedness rules need the Q-018 anti-rigidity flags to
  decide whether OntoClean-based validation is feasible.
- Spec 4's non-redundancy UI needs the Q-020 external-field comparison
  to decide what counts as "different-looking presentations of the
  same behaviour" in the wild.

Without spec 5's data, specs 2/3/4 can be drafted but cannot be
*signed off* for implementation.

**Why specs 2/3/4 can run in parallel after spec 5.** The vertical
decomposition (§3) gives each spec a self-contained surface. Spec 4
treats specs 2 and 3 as black boxes; specs 2 and 3 do not call into
each other (the soundness invariant is a one-way obligation from C008
to C006, not a cross-call). The only coupling is the shared
`argument_scheme` schema, and spec 2 owns it.

---

## §6 Out of scope (and why)

The following items are **explicitly out of scope** for this
implementation phase, even though they are recognised as relevant:

- **Materialised three-table schema.** Deferred per P5. Re-evaluate
  after spec 5's audits and after one quarter of production data
  under the additive checks of specs 2/3.
- **Scheme versioning.** Spec 2 documents the shape but does not
  implement. Versioning is a substantial schema and migration project
  in its own right and is downstream of the well-formedness rules
  landing.
- **Composition / chained-scheme support beyond what exists today.**
  Q-015 (the soundness-of-concatenation conjecture) is research-open;
  shipping a composition spec before the conjecture is settled would
  bake in a position the programme has not taken.
- **CQ-of-CQ recursion enforcement.** Q-017 is research-open; the
  admin's "show inherited CQs" depth limit (if any) is left as-is
  pending Q-017.
- **AIF / ASPIC+ / Argdown import beyond the existing round-trip.**
  Spec 4 adds the *identity discipline* to the existing round-trip but
  does not add new import paths. New imports are downstream of Q-020.
- **Public scheme catalogue / publication discipline.** Out of scope;
  the implementation phase targets the substrate's internal catalogue.

---

## §7 Spec format (read before writing or reviewing any sibling spec)

Each sibling spec follows the same eight-section structure. Reviewers
and implementers can rely on the structure being uniform:

1. **Problem statement.** What this spec is solving and which premise
   (P1–P5) it inherits from.
2. **Goals and non-goals.** Bulleted; non-goals must be explicit.
3. **API contract.** Function signatures, endpoint shapes, validator
   interfaces. TypeScript types preferred.
4. **Data model.** Schema diffs (`prisma/schema.prisma` deltas);
   migrations named.
5. **Migration plan.** Posture (per §4) + phase boundaries + acceptance
   criteria per phase.
6. **Acceptance criteria.** Testable statements; one per phase.
7. **Open risks.** Things the spec author flagged as could-go-wrong;
   one per risk + mitigation if known.
8. **Dependencies.** Other specs, other audits, other research-open
   items.

Specs deviate from this structure only with a one-paragraph rationale
at the top.

---

## §8 Pointers

**Research programme**:
- [`RESEARCH_PROGRAMME/00_CHARTER.md`](../../RESEARCH_PROGRAMME/00_CHARTER.md)
- [`RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md`](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md)
- [T003 — Schemes Layered Coherence](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md)
- [C006](../../RESEARCH_PROGRAMME/03_CONJECTURES/C006-scheme-as-behaviour.md) / [C007](../../RESEARCH_PROGRAMME/03_CONJECTURES/C007-scheme-as-design-schema.md) / [C008](../../RESEARCH_PROGRAMME/03_CONJECTURES/C008-scheme-as-protocol-constraint.md)

**Architecture context**:
- [`SCHEMES_THEORETICAL_FOUNDATIONS.md`](SCHEMES_THEORETICAL_FOUNDATIONS.md)
- [`SCHEMES_ONTOLOGY_DECISION.md`](SCHEMES_ONTOLOGY_DECISION.md)
- [`SCHEMES_LITERATURE_REVIEW.md`](SCHEMES_LITERATURE_REVIEW.md)
- [`AIF_ONTOLOGY_SYSTEM_ARCHITECTURE.md`](AIF_ONTOLOGY_SYSTEM_ARCHITECTURE.md)
- [`ASPIC_SYSTEM_ARCHITECTURE.md`](ASPIC_SYSTEM_ARCHITECTURE.md)
- [`LUDICS_SYSTEM_ARCHITECTURE.md`](LUDICS_SYSTEM_ARCHITECTURE.md)
- [`Ludics Generative Substrate Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`](Ludics%20Generative%20Substrate%20Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md)

**Code touched (by spec)**:
- Spec 2: [`components/admin/SchemeCreator.tsx`](../../components/admin/SchemeCreator.tsx), [`components/admin/SchemeHierarchyView.tsx`](../../components/admin/SchemeHierarchyView.tsx), `prisma/schema.prisma` (`argument_scheme`, `argument_scheme_cq`), [`lib/argumentation/cqGeneration.ts`](../../lib/argumentation/cqGeneration.ts), [`app/api/schemes/`](../../app/api/schemes/)
- Spec 3: room protocol code under [`server/`](../../server/), CQ-locus handling, instance-close hooks on `argument_scheme_application`
- Spec 4: new verifier module (TBD path); [`lib/aif/syncArgument.ts`](../../lib/aif/syncArgument.ts) for AIF round-trip; new admin widget on `SchemeCreator`
- Spec 5: read-only audits; SQL scripts under [`scripts/`](../../scripts/) or `sql/`
